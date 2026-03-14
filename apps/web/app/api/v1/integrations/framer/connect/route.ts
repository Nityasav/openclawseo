import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const FramerConnectSchema = z.object({
  api_key: z.string().min(1),
  project_id: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = FramerConnectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (!profile?.org_id) return NextResponse.json({ success: false, error: "No org" }, { status: 403 });

    await supabase.from("integrations").upsert({
      org_id: profile.org_id,
      provider: "framer",
      access_token: parsed.data.api_key,
      config_json: { project_id: parsed.data.project_id },
    }, { onConflict: "org_id,provider" });

    return NextResponse.json({ success: true, data: { connected: true } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to connect Framer" }, { status: 500 });
  }
}
