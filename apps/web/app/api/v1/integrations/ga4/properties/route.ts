import { createClient } from "@/lib/supabase/server";
import { listGA4Properties } from "@/lib/integrations/ga4";
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
      .eq("provider", "ga4")
      .single();

    if (!integration?.access_token || !integration?.refresh_token) {
      return NextResponse.json({ error: "GA4 not connected" }, { status: 400 });
    }

    const accessToken = decrypt(integration.access_token);
    const refreshToken = decrypt(integration.refresh_token);
    const properties = await listGA4Properties(accessToken, refreshToken);

    return NextResponse.json({ properties });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch GA4 properties";
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
    const propertyId = body.property_id;
    if (!propertyId) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    // Find existing site for this org or create one
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false)
      .limit(1)
      .single();

    if (existingSite) {
      const { error } = await supabase
        .from("sites")
        .update({ ga4_property_id: propertyId })
        .eq("id", existingSite.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from("sites").insert({
        org_id: profile.org_id,
        domain: "default",
        ga4_property_id: propertyId,
        is_sandbox: false,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, ga4_property_id: propertyId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save property";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
