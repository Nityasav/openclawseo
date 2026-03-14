import { createClient } from "@/lib/supabase/server";
import { sendDiscordTestMessage } from "@/lib/integrations/discord";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (!profile?.org_id) return NextResponse.json({ success: false, error: "No org" }, { status: 403 });

    const { data: integration } = await supabase
      .from("integrations")
      .select("config_json")
      .eq("org_id", profile.org_id)
      .eq("provider", "discord")
      .single();

    const config = integration?.config_json as { webhook_url?: string } | null;
    if (!config?.webhook_url) {
      return NextResponse.json({ success: false, error: "Discord not connected" }, { status: 400 });
    }

    await sendDiscordTestMessage(config.webhook_url);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send test message";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
