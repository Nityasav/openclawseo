import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  provider: z.enum(["gsc", "ga4"]),
  // For GSC: siteUrl (e.g. "https://example.com/")
  // For GA4: propertyId (e.g. "123456789")
  value: z.string().min(1),
  domain: z.string().min(1), // domain to create/update the site record with
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { provider, value, domain } = parsed.data;

    // Use user client only for auth — service client for DB writes to bypass RLS
    // (sites table has no UPDATE policy; we enforce ownership manually via orgId)
    const supabase = createClient();
    const db = createServiceClient();
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
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 403 });
    }

    // Find or create site record for this domain
    let { data: site } = await db
      .from("sites")
      .select("id")
      .eq("org_id", orgId)
      .eq("domain", domain)
      .eq("is_sandbox", false)
      .single();

    if (!site) {
      const { data: newSite, error: siteError } = await db
        .from("sites")
        .insert({ org_id: orgId, domain })
        .select("id")
        .single();

      if (siteError || !newSite) {
        return NextResponse.json({ success: false, error: "Failed to create site" }, { status: 500 });
      }
      site = newSite;
    }

    // Update the correct column
    const updateData = provider === "gsc"
      ? { gsc_property_url: value }
      : { ga4_property_id: value };

    const { error: updateError } = await db
      .from("sites")
      .update(updateData)
      .eq("id", site.id)
      .eq("org_id", orgId); // re-assert ownership even with service client

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, siteId: site.id });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
