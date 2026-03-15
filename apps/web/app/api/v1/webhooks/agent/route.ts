import { createServiceClient } from "@/lib/supabase/server";
import { AgentWebhookSchema } from "@/types/schemas";
import { buildDiscordReportMessage, sendDiscordMessage } from "@/lib/integrations/discord";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AgentWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const { run_id, status, result_json, error_message, tokens_used, secret } = parsed.data;

    // Verify webhook secret
    const expectedSecret = process.env.AGENT_WEBHOOK_SECRET ?? "crawl_webhook_secret_2026";
    if (secret !== expectedSecret) {
      return NextResponse.json({ success: false, error: "Invalid secret" }, { status: 403 });
    }

    const supabase = createServiceClient();

    // Update agent run
    await supabase
      .from("agent_runs")
      .update({
        status,
        completed_at: new Date().toISOString(),
        result_json: result_json as Record<string, unknown> ?? null,
        error_message: error_message ?? null,
        tokens_used: tokens_used ?? null,
      })
      .eq("id", run_id);

    if (status === "complete" && result_json) {
      // Get the run to find site
      const { data: run } = await supabase
        .from("agent_runs")
        .select("site_id, run_type")
        .eq("id", run_id)
        .single();

      if (run) {
        // Create report record
        const resultData = result_json as Record<string, unknown>;
        const { data: report } = await supabase
          .from("reports")
          .insert({
            site_id: run.site_id,
            agent_run_id: run_id,
            title: `${run.run_type} Report — ${new Date().toLocaleDateString()}`,
            summary: typeof resultData.summary === "string" ? resultData.summary : "Agent run completed",
            report_json: result_json as Record<string, unknown>,
          })
          .select()
          .single();

        // Send Discord notification
        const { data: site } = await supabase
          .from("sites")
          .select("domain, org_id")
          .eq("id", run.site_id)
          .single();

        if (site) {
          const { data: integration } = await supabase
            .from("integrations")
            .select("config_json")
            .eq("org_id", site.org_id)
            .eq("provider", "discord")
            .single();

          const config = integration?.config_json as { webhook_url?: string } | null;
          if (config?.webhook_url) {
            const seoReport = resultData.seo_report as Record<string, unknown> | undefined;
            const geoReport = resultData.geo_report as Record<string, unknown> | undefined;

            // Compute live geo score from geo_records (same formula as dashboard)
            const { data: geoRecords } = await supabase
              .from("geo_records")
              .select("is_cited")
              .eq("site_id", run.site_id);

            let liveGeoScore: number | undefined;
            if (geoRecords && geoRecords.length > 0) {
              const cited = geoRecords.filter((r) => r.is_cited).length;
              liveGeoScore = Math.round((cited / geoRecords.length) * 100);
            }

            const storedGeoScore = typeof geoReport?.llm_visibility_score === "number" ? geoReport.llm_visibility_score : undefined;
            const geoScore = liveGeoScore ?? storedGeoScore;

            const message = buildDiscordReportMessage({
              title: `SEO Report: ${site.domain}`,
              summary: typeof resultData.summary === "string" ? resultData.summary : "Audit complete.",
              domain: site.domain,
              healthScore: typeof seoReport?.overall_health_score === "number" ? seoReport.overall_health_score : undefined,
              geoScore,
              actionItems: Array.isArray(seoReport?.action_items)
                ? (seoReport.action_items as Array<{ action: string; effort?: string }>)
                : undefined,
              topWins: Array.isArray(seoReport?.top_wins)
                ? (seoReport.top_wins as Array<{ title: string }>)
                : undefined,
              criticalIssues: Array.isArray(seoReport?.critical_issues)
                ? (seoReport.critical_issues as Array<{ title: string; urgency?: string }>)
                : undefined,
            });

            await sendDiscordMessage(config.webhook_url, message).catch(console.error);

            if (report) {
              await supabase
                .from("reports")
                .update({ delivered_to_discord: true })
                .eq("id", report.id);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
