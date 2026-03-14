import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: run, error } = await supabase
      .from("agent_runs")
      .select("*")
      .eq("id", params.runId)
      .single();

    if (error || !run) {
      return NextResponse.json({ success: false, error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: run });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to get run status" }, { status: 500 });
  }
}
