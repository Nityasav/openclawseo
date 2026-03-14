import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { site_id } = await req.json();
    if (!site_id) {
      return NextResponse.json({ success: false, error: "Missing site_id" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ success: false, error: "No org" }, { status: 403 });
    }

    // Verify site belongs to user's org
    const { data: site } = await supabase
      .from("sites")
      .select("id, org_id")
      .eq("id", site_id)
      .single();

    if (!site || site.org_id !== profile.org_id) {
      return NextResponse.json({ success: false, error: "Site not found or unauthorized" }, { status: 404 });
    }

    // Delete related data first, then the site
    await supabase.from("geo_records").delete().eq("site_id", site_id);
    await supabase.from("keywords").delete().eq("site_id", site_id);
    await supabase.from("rankings").delete().eq("site_id", site_id);
    await supabase.from("sites").delete().eq("id", site_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete site";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
