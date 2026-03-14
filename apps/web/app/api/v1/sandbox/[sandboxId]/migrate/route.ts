import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const supabase = createClient();
    const serviceSupabase = createServiceClient();

    const { data: sandbox } = await serviceSupabase
      .from("sandbox_environments")
      .select("*")
      .eq("id", params.sandboxId)
      .single();

    if (!sandbox) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          redirect_to: `/auth/login?next=/dashboard/overview&sandbox_id=${params.sandboxId}`,
          message: "Sign up to activate your live account",
        },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ success: false, error: "No org" }, { status: 403 });
    }

    // Create a real site from the sandbox config
    const { data: newSite } = await serviceSupabase
      .from("sites")
      .insert({
        org_id: profile.org_id,
        domain: `migrated-from-sandbox-${params.sandboxId.slice(0, 8)}.example.com`,
        is_sandbox: false,
      })
      .select()
      .single();

    // Mark sandbox as expired
    await serviceSupabase
      .from("sandbox_environments")
      .update({ status: "expired" })
      .eq("id", params.sandboxId);

    return NextResponse.json({
      success: true,
      data: {
        site_id: newSite?.id,
        redirect_to: "/dashboard/settings?tab=integrations&migrated=true",
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Migration failed" }, { status: 500 });
  }
}
