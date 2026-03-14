import { createClient } from "@/lib/supabase/server";
import { SlackConnectSchema } from "@/types/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = SlackConnectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (!profile?.org_id) return NextResponse.json({ success: false, error: "No org" }, { status: 403 });

    await supabase.from("integrations").upsert({
      org_id: profile.org_id,
      provider: "slack",
      config_json: { webhook_url: parsed.data.webhook_url, site_id: parsed.data.site_id },
    }, { onConflict: "org_id,provider" });

    return NextResponse.json({ success: true, data: { connected: true } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to connect Slack" }, { status: 500 });
  }
}
