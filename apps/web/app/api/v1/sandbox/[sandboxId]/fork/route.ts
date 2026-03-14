import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const supabase = createServiceClient();
    const { data: original } = await supabase
      .from("sandbox_environments")
      .select("*")
      .eq("id", params.sandboxId)
      .single();

    if (!original) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    const { data: forked } = await supabase
      .from("sandbox_environments")
      .insert({
        org_id: original.org_id,
        template: original.template,
        status: "ready",
        access_token: randomBytes(32).toString("hex"),
        role: original.role,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    return NextResponse.json({ success: true, data: forked });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fork sandbox" }, { status: 500 });
  }
}
