import { createServiceClient } from "@/lib/supabase/server";
import { PromoteToTemplateSchema } from "@/types/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { sandboxId: string } }
) {
  try {
    const body = await request.json();
    const parsed = PromoteToTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: sandbox } = await supabase
      .from("sandbox_environments")
      .select("id, status")
      .eq("id", params.sandboxId)
      .single();

    if (!sandbox) {
      return NextResponse.json({ success: false, error: "Sandbox not found" }, { status: 404 });
    }

    if (sandbox.status === "expired") {
      return NextResponse.json({ success: false, error: "Cannot promote an expired sandbox" }, { status: 400 });
    }

    const { data: updated } = await supabase
      .from("sandbox_environments")
      .update({
        is_template: true,
        scenario_name: parsed.data.scenario_name,
      })
      .eq("id", params.sandboxId)
      .select("id, scenario_name, is_template, template, role, scenario_config")
      .single();

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to promote sandbox" }, { status: 500 });
  }
}
