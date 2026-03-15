import { createClient } from "@/lib/supabase/server";
import { buildDiscordReportMessage, sendDiscordMessage } from "@/lib/integrations/discord";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SendReportSchema = z.object({ report_id: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = SendReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid report ID" }, { status: 400 });
    }

    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
    if (!profile?.org_id) return NextResponse.json({ success: false, error: "No org" }, { status: 403 });

    // Fetch the report and verify ownership via site → org
    const { data: report } = await supabase
      .from("reports")
      .select("*, sites(domain, org_id)")
      .eq("id", parsed.data.report_id)
      .single();

    if (!report) return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });

    const site = report.sites as { domain: string; org_id: string } | null;
    if (site?.org_id !== profile.org_id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("config_json")
      .eq("org_id", profile.org_id)
      .eq("provider", "discord")
      .single();

    const config = integration?.config_json as { webhook_url?: string } | null;
    if (!config?.webhook_url) {
      return NextResponse.json({ success: false, error: "Discord not connected. Add a webhook URL in Settings." }, { status: 400 });
    }

    // Compute live geo score from geo_records (same formula as dashboard)
    const { data: geoRecords } = await supabase
      .from("geo_records")
      .select("is_cited")
      .eq("site_id", report.site_id);

    let liveGeoScore: number | undefined;
    if (geoRecords && geoRecords.length > 0) {
      const cited = geoRecords.filter((r) => r.is_cited).length;
      liveGeoScore = Math.round((cited / geoRecords.length) * 100);
    }

    const data = report.report_json as Record<string, unknown> | null;
    const seoReport = data?.seo_report as Record<string, unknown> | undefined;
    const geoReport = data?.geo_report as Record<string, unknown> | undefined;

    const storedGeoScore = typeof geoReport?.llm_visibility_score === "number" ? geoReport.llm_visibility_score : undefined;
    const geoScore = liveGeoScore ?? storedGeoScore;

    const message = buildDiscordReportMessage({
      title: report.title ?? "SEO Audit Report",
      summary: report.summary ?? "Audit complete.",
      domain: site?.domain ?? "your site",
      healthScore: typeof seoReport?.overall_health_score === "number" ? seoReport.overall_health_score : undefined,
      geoScore,
      actionItems: Array.isArray(seoReport?.action_items)
        ? (seoReport.action_items as Array<{ action: string; effort?: string }>)
        : undefined,
      keywordGaps: Array.isArray(data?.keyword_gaps)
        ? (data.keyword_gaps as Array<{ keyword: string; current_position: number; opportunity_score: number }>)
        : undefined,
      topWins: Array.isArray(seoReport?.top_wins)
        ? (seoReport.top_wins as Array<{ title: string }>)
        : undefined,
      criticalIssues: Array.isArray(seoReport?.critical_issues)
        ? (seoReport.critical_issues as Array<{ title: string; urgency?: string }>)
        : undefined,
    });

    await sendDiscordMessage(config.webhook_url, message);

    await supabase.from("reports").update({ delivered_to_discord: true }).eq("id", report.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send report";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
