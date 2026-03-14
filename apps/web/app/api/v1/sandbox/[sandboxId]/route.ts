import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("token");

    const supabase = createServiceClient();
    const { data: sandbox, error } = await supabase
      .from("sandbox_environments")
      .select("*")
      .eq("id", params.sandboxId)
      .single();

    if (error || !sandbox) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    // Verify access token for public access
    if (sandbox.access_token !== accessToken) {
      return NextResponse.json({ success: false, error: "Invalid access token" }, { status: 403 });
    }

    // Check expiry
    if (new Date(sandbox.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Sandbox expired" }, { status: 410 });
    }

    return NextResponse.json({ success: true, data: sandbox });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to get sandbox" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const supabase = createServiceClient();
    await supabase
      .from("sandbox_environments")
      .update({ status: "expired" })
      .eq("id", params.sandboxId);

    return NextResponse.json({ success: true, data: { expired: true } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to expire sandbox" }, { status: 500 });
  }
}
