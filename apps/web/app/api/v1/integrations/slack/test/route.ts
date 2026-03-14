import { createClient } from "@/lib/supabase/server";
import { sendTestMessage } from "@/lib/integrations/slack";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TestSchema = z.object({ site_id: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = TestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (!profile?.org_id) return NextResponse.json({ success: false, error: "No org" }, { status: 403 });

    const { data: integration } = await supabase
      .from("integrations")
      .select("config_json")
      .eq("org_id", profile.org_id)
      .eq("provider", "slack")
      .single();

    const config = integration?.config_json as { webhook_url?: string } | null;
    if (!config?.webhook_url) {
      return NextResponse.json({ success: false, error: "Slack not connected" }, { status: 404 });
    }

    await sendTestMessage(config.webhook_url);
    return NextResponse.json({ success: true, data: { sent: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Test failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
