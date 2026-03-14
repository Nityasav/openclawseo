import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const supabase = createServiceClient();
    const { data: sandbox } = await supabase
      .from("sandbox_environments")
      .select("template")
      .eq("id", params.sandboxId)
      .single();

    if (!sandbox) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    // Reset: update expires_at and status
    await supabase
      .from("sandbox_environments")
      .update({
        status: "ready",
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", params.sandboxId);

    return NextResponse.json({ success: true, data: { reset: true } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to reset sandbox" }, { status: 500 });
  }
}
