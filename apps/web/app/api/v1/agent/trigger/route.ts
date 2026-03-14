import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { TriggerAgentSchema } from "@/types/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = TriggerAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { site_id, run_type } = parsed.data;

    // Verify user has access to the site
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 403 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", site_id)
      .eq("org_id", profile.org_id)
      .single();

    if (!site) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    // Create agent run record
    const { data: agentRun, error: runError } = await supabase
      .from("agent_runs")
      .insert({
        site_id,
        run_type,
        status: "pending",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !agentRun) {
      return NextResponse.json(
        { success: false, error: "Failed to create agent run" },
        { status: 500 }
      );
    }

    // Trigger the agent microservice (fire-and-forget)
    const agentServiceUrl = process.env.AGENT_SERVICE_URL;
    if (agentServiceUrl) {
      fetch(`${agentServiceUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: agentRun.id,
          site_id,
          run_type,
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/agent`,
          webhook_secret: process.env.AGENT_WEBHOOK_SECRET,
        }),
      }).catch((err) => console.error("Agent trigger failed:", err));
    } else {
      // Simulate completion for demo/dev purposes
      setTimeout(async () => {
        await supabase
          .from("agent_runs")
          .update({
            status: "complete",
            completed_at: new Date().toISOString(),
            result_json: {
              summary: "Demo run completed successfully",
              keywords_analyzed: 50,
              opportunities_found: 8,
            },
            tokens_used: 1250,
          })
          .eq("id", agentRun.id);
      }, 3000);
    }

    return NextResponse.json({
      success: true,
      data: { run_id: agentRun.id, status: "pending" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
