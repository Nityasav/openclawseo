import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: templates, error } = await supabase
      .from("sandbox_environments")
      .select("id, scenario_name, scenario_config, template, role, walkthrough_steps, created_at, access_token")
      .eq("is_template", true)
      .neq("status", "expired")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: templates ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch templates" }, { status: 500 });
  }
}
