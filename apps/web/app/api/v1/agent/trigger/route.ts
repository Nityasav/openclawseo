import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { TriggerAgentSchema } from "@/types/schemas";
import { decrypt } from "@/lib/encryption";
import { fetchGscData } from "@/lib/integrations/gsc";
import { fetchGA4Data } from "@/lib/integrations/ga4";

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
      .select("id, gsc_property_url, ga4_property_id")
      .eq("id", site_id)
      .eq("org_id", profile.org_id)
      .single();

    if (!site) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    // Fetch real GSC + GA4 data to give the agent actual signal to work with
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    let gscData: Record<string, unknown>[] = [];
    let ga4Data: Record<string, unknown>[] = [];

    if (site.gsc_property_url) {
      const { data: gscIntegration } = await supabase
        .from("integrations")
        .select("access_token, refresh_token")
        .eq("org_id", profile.org_id)
        .eq("provider", "gsc")
        .single();

      if (gscIntegration?.access_token) {
        try {
          const accessToken = decrypt(gscIntegration.access_token);
          const refreshToken = gscIntegration.refresh_token ? decrypt(gscIntegration.refresh_token) : "";
          const rows = await fetchGscData(
            accessToken, refreshToken,
            site.gsc_property_url, startDate, endDate,
            { dimensions: ["query", "page"], rowLimit: 500 }
          );
          gscData = rows.map((r) => ({
            query: r.keys?.[0] ?? "",
            page: r.keys?.[1] ?? "",
            clicks: r.clicks ?? 0,
            impressions: r.impressions ?? 0,
            ctr: r.ctr ?? 0,
            position: r.position ?? 0,
          }));
        } catch (err) {
          console.error("Failed to fetch GSC data for agent:", err);
        }
      }
    }

    if (site.ga4_property_id) {
      const { data: ga4Integration } = await supabase
        .from("integrations")
        .select("access_token, refresh_token")
        .eq("org_id", profile.org_id)
        .eq("provider", "ga4")
        .single();

      if (ga4Integration?.access_token) {
        try {
          const accessToken = decrypt(ga4Integration.access_token);
          const refreshToken = ga4Integration.refresh_token ? decrypt(ga4Integration.refresh_token) : "";
          const rows = await fetchGA4Data(accessToken, refreshToken, site.ga4_property_id, startDate, endDate);
          ga4Data = rows.map((r) => ({
            date: r.dimensionValues?.[0]?.value ?? "",
            page: r.dimensionValues?.[1]?.value ?? "",
            source: r.dimensionValues?.[2]?.value ?? "",
            sessions: parseInt(r.metricValues?.[0]?.value ?? "0"),
            bounceRate: parseFloat(r.metricValues?.[1]?.value ?? "0"),
            conversions: parseInt(r.metricValues?.[2]?.value ?? "0"),
          }));
        } catch (err) {
          console.error("Failed to fetch GA4 data for agent:", err);
        }
      }
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

    const agentServiceUrl = process.env.AGENT_SERVICE_URL;
    if (agentServiceUrl) {
      fetch(`${agentServiceUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: agentRun.id,
          site_id,
          run_type,
          gsc_data: gscData,
          ga4_data: ga4Data,
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/agent`,
          webhook_secret: process.env.AGENT_WEBHOOK_SECRET,
        }),
      }).catch((err) => console.error("Agent trigger failed:", err));
    } else {
      // Demo/dev mode: complete synchronously
      await supabase
        .from("agent_runs")
        .update({
          status: "complete",
          completed_at: new Date().toISOString(),
          result_json: {
            summary: gscData.length > 0
              ? `Audit completed with ${gscData.length} GSC queries analyzed over 90 days.`
              : "Audit completed — connect GSC for keyword insights.",
            keywords_analyzed: gscData.length,
            opportunities_found: 8,
          },
          tokens_used: 1250,
        })
        .eq("id", agentRun.id);
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
