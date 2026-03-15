import { createServiceClient } from "@/lib/supabase/server";
import { SaveWalkthroughStepSchema } from "@/types/schemas";
import { NextRequest, NextResponse } from "next/server";
import type { WalkthroughStep } from "@/lib/sandbox/scenario";

export async function POST(
  request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const body = await request.json();
    const parsed = SaveWalkthroughStepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Verify access token from Authorization header or query param
    const authHeader = request.headers.get("authorization");
    const tokenFromHeader = authHeader?.replace("Bearer ", "");
    const tokenFromQuery = request.nextUrl.searchParams.get("token");
    const providedToken = tokenFromHeader ?? tokenFromQuery;

    const supabase = createServiceClient();
    const { data: sandbox } = await supabase
      .from("sandbox_environments")
      .select("access_token, walkthrough_steps")
      .eq("id", params.sandboxId)
      .single();

    if (!sandbox) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    if (providedToken && sandbox.access_token !== providedToken) {
      return NextResponse.json({ success: false, error: "Invalid access token" }, { status: 403 });
    }

    const existingSteps: WalkthroughStep[] = Array.isArray(sandbox.walkthrough_steps)
      ? (sandbox.walkthrough_steps as WalkthroughStep[])
      : [];

    const newStep: WalkthroughStep = {
      id: `step_${Date.now()}`,
      title: parsed.data.title,
      description: parsed.data.description,
      url_hash: parsed.data.url_hash,
      scroll_y: parsed.data.scroll_y,
      captured_at: new Date().toISOString(),
    };

    const updatedSteps = [...existingSteps, newStep];

    await supabase
      .from("sandbox_environments")
      .update({ walkthrough_steps: updatedSteps })
      .eq("id", params.sandboxId);

    return NextResponse.json({ success: true, data: { steps: updatedSteps, added: newStep } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save walkthrough step" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const stepId = request.nextUrl.searchParams.get("stepId");
    if (!stepId) {
      return NextResponse.json({ success: false, error: "Missing stepId" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: sandbox } = await supabase
      .from("sandbox_environments")
      .select("walkthrough_steps")
      .eq("id", params.sandboxId)
      .single();

    if (!sandbox) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    const existingSteps: WalkthroughStep[] = Array.isArray(sandbox.walkthrough_steps)
      ? (sandbox.walkthrough_steps as WalkthroughStep[])
      : [];

    const updatedSteps = existingSteps.filter((s) => s.id !== stepId);

    await supabase
      .from("sandbox_environments")
      .update({ walkthrough_steps: updatedSteps })
      .eq("id", params.sandboxId);

    return NextResponse.json({ success: true, data: { steps: updatedSteps } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete walkthrough step" }, { status: 500 });
  }
}
