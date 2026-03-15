import { createServiceClient } from "@/lib/supabase/server";
import { generateSandboxData } from "@/lib/sandbox/generator";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("token");
    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: sandbox, error } = await supabase
      .from("sandbox_environments")
      .select("*")
      .eq("access_token", accessToken)
      .single();

    if (error || !sandbox) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    if (new Date(sandbox.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Sandbox expired" }, { status: 410 });
    }

    if (sandbox.status === "expired") {
      return NextResponse.json({ success: false, error: "Sandbox expired" }, { status: 410 });
    }

    const seed = new Date(sandbox.created_at).getTime();
    const syntheticData = generateSandboxData(sandbox.template, seed);

    return NextResponse.json({
      success: true,
      data: {
        id: sandbox.id,
        access_token: sandbox.access_token,
        template: sandbox.template,
        role: sandbox.role,
        status: sandbox.status,
        expires_at: sandbox.expires_at,
        synthetic_data: syntheticData,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to get sandbox" }, { status: 500 });
  }
}
